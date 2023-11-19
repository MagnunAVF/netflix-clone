ASSETS_FOLDER=assets/timeline
for MEDIA_FILE in `ls $ASSETS_FOLDER | grep .mp4`; do
    FILENAME=$(echo $MEDIA_FILE | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')
    INPUT=$ASSETS_FOLDER/$MEDIA_FILE
    FOLDER_TARGET=$ASSETS_FOLDER/$FILENAME
    mkdir -p $FOLDER_TARGET

    OUTPUT=$ASSETS_FOLDER/$FILENAME/$FILENAME
    DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')

    OUTPUT144=$OUTPUT-$DURATION-144
    OUTPUT360=$OUTPUT-$DURATION-360
    OUTPUT720=$OUTPUT-$DURATION-720

    echo 'Rendering in 720p'
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 1500k \
        -maxrate 1500k \
        -bufsize 1000k \
        -vf "scale=-1:720" \
        $OUTPUT720.mp4

    echo 'Rendering in 360p'
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 400k \
        -maxrate 400k \
        -bufsize 400k \
        -vf "scale=-1:360" \
        $OUTPUT360.mp4

    echo 'Rendering in 144p'
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 300k \
        -maxrate 300k \
        -bufsize 300k \
        -vf "scale=256:144" \
        $OUTPUT144.mp4

    echo "Success!"
    echo $OUTPUT144.mp4
    echo $OUTPUT360.mp4
    echo $OUTPUT720.mp4
done