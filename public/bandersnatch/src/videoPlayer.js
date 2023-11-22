class VideoMediaPlayer {
    constructor({ manifestJSON, network, videoComponent }) {
        this.manifestJSON = manifestJSON
        this.network = network
        this.videoComponent = videoComponent
        this.videoElement = null
        this.sourceBuffer = null
        this.activeItem = {}
        this.selected = {}
        this.videoDuration = 0
    }

    initializeCodec() {
        this.videoElement = document.getElementById("vid")
        const mediaSourceSupported = !!window.MediaSource;

        if(!mediaSourceSupported) {
            alert('Seu browser ou sistema não tem suporte a MSE!\nTente utilizar outro navegador')
            return;
        }

        const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec)
        if(!codecSupported) {
            alert(`Seu browser ou sistema não tem suporte ao codec '${this.manifestJSON.codec}' !\nTente utilizar outro navegador`)
            return;
        }

        const mediaSource = new MediaSource()
        this.videoElement.src = URL.createObjectURL(mediaSource)

        mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource))
    }

    sourceOpenWrapper(mediaSource) {
        return async(_) => {
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec)
            const selected = this.selected = this.manifestJSON.intro
            // avoid to run as LIVE
            mediaSource.duration = this.videoDuration
            await this.fileDownload(selected.url)
            setInterval(this.waitForQuestions.bind(this), 200)
        }
    }

    waitForQuestions() {
        const currentTime = parseInt(this.videoElement.currentTime)
        const option = this.selected.at === currentTime
        // skip if is not the correct moment to display options
        if(!option) return;

        // avoid open the modal multiple times
        if(this.activeItem.url === this.selected.url) return;

        this.videoComponent.configureModal(this.selected)
        this.activeItem = this.selected;
    }

    async nextChunk(data) {
        const key = data.toLowerCase()
        const selected = this.manifestJSON[key]
        this.selected = {
            ...selected,
            // adjusts the time that the modal will appear based on current time
            at: parseInt(this.videoElement.currentTime + selected.at)
        }

        // run the rest of the video at the same time that download the next segment
        this.videoElement.play()

        await this.fileDownload(selected.url)
    }

    async fileDownload(url) {
        const prepareUrl = {
            url,
            fileResolution: 360,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag
        }
        const finalUrl = this.network.parseManifestURL(prepareUrl)
        this.setVideoPlayerDuration(finalUrl)
        const data = await this.network.fetchFile(finalUrl)
        return this.processBufferSegments(data)
    }

    setVideoPlayerDuration(finalUrl) {
        const bars = finalUrl.split('/')
        const [ name, videoDuration ] = bars[bars.length - 1].split('-')
        this.videoDuration += parseFloat(videoDuration)
    }

    async processBufferSegments(allSegments) {
        const sourceBuffer = this.sourceBuffer
        sourceBuffer.appendBuffer(allSegments)

        return new Promise((resolve, reject) => {
            const updateEnd = (_) => {
                sourceBuffer.removeEventListener("updateend", updateEnd)
                sourceBuffer.timestampOffset = this.videoDuration

                return resolve()
            }

            sourceBuffer.addEventListener("updateend", updateEnd)
            sourceBuffer.addEventListener("error", reject)
        })
    }
}