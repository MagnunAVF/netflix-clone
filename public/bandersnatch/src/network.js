class Network {
    constructor({ host }) {
        this.host = host
    }

    parseManifestURL({ url, fileResolution, fileResolutionTag, hostTag}) {
        return url
            .replace(fileResolutionTag, fileResolution)
            .replace(hostTag, this.host)
    }

    async fetchFile(url) {
        const response = await fetch(url)
        return response.arrayBuffer()
    }

    async getProperResolution(url) {
        const startMs = Date.now()
        const response = await fetch(url)
        await response.arrayBuffer()
        const endMs = Date.now()
        const durationInMs =  (endMs - startMs)

        // we will set the resolution based on time (instead of throughput)
        const resolutions = [
            // worst case, <= 20 seconds
            { start: 3001, end: 20000, resolution: 144 },
            // <= 3 seconds
            { start: 901, end: 3000, resolution: 360 },
            // < 1 second
            { start: 0, end: 900, resolution: 720 }
        ]

        const item = resolutions.find(item => {
            return item.start <= durationInMs && item.end >= durationInMs
        })

        const LOWEST_RESOLUTION = 144
        // >= 20 seconds
        if(!item) return LOWEST_RESOLUTION

        return item.resolution
    }
}