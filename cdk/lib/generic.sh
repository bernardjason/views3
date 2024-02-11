#!/bin/bash

destination=$1
homedir=/home/ftp

ffmpeg=/home/pushs3/ffmpeg

export PATH=/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin

if [ -z "$destination" ] ; then
        echo "Please supply destination bucket/path"
        exit 1
fi

processing=$homedir/.process

cd $homedir

if [ -d $processing ] ; then
        echo "Either broken or transfer in progress"
        echo "Directory $processing exists"
        exit 0
fi

mkdir $processing

# just in case file transfer in progress. Ok for low load

touch /tmp/modmarker
sleep 2
while [ "$(find . -newer /tmp/modmarker -print)" != "" ]; do
    echo "Wait transfer in progress"
    touch /tmp/modmarker
    sleep 5
done

echo "ready no files appear in progress"

directories=$(find . -maxdepth 1 -not -path . -not -path ./.process )

for i in $directories
do
        for x in $(ls -d $i/*)
        do
                d=$(basename $x)
                echo "process $i/$d"
                sudo chown -R pushs3 $i/$d/* 2>/dev/null
                mkdir -p $processing/$i/$d
                mv $i/$d/* $processing/$i/$d 2>/dev/null
        done
done


cd $processing

for i in $(find . -name "*.jpg" -print)
do
        echo $i
        icon=$(echo $i | sed 's/\.jpg/-icon.jpg/')

        $ffmpeg -hide_banner -loglevel error -i $i -s 320x240      $icon

done

for i in $(find . -name "*.mp4" -print)
do
        echo $i
        dest=$(echo $i | sed 's/\.mp4/-scaled.mp4/')
        icon=$(echo $i | sed 's/\.mp4/-icon.jpg/')

        $ffmpeg -hide_banner -loglevel error -i $i -ss 00:00:00 -frames:v 1 -s 320x240   $icon

        # really scale down as running out of memory
        $ffmpeg -hide_banner -loglevel error -i $i -codec:v libx264 -rc-lookahead 6 -vf scale=1280:-2 $dest
        if [ $? -eq 0 ] ; then
            rm -f $i
        else
            rm -f $dest
        fi
done
aws s3 sync $processing/ $destination
if [ $? -eq 0 ] ; then
        rm -rf $processing
else
        echo "No zero exit from sync. not removing files"
fi
exit 0
