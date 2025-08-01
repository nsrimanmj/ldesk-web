#!/bin/bash

echo "Starting Build"

BASEDIR="$1"

SRCDIR="$BASEDIR/src"

# Directory containing dojo libraries and build utilities
UTILDIR="$SRCDIR/js/util/buildscripts"

#Destination directory for built code
DISTDIR="$BASEDIR/dist"

#Main application package build configuration
PROFILE="$BASEDIR/profiles/app.profile.js"

# CSS files directory
CSSDIR="$SRCDIR/css"

#EXTERNALJS files directory
EXTERNALJSDIR="$SRCDIR/js/external"

#Application images directory
IMGDIR="$SRCDIR/images"

#index.html file
INDEXFILE="$SRCDIR/index.html"

#config directory
CONFIGDIR="$SRCDIR/config"

#Check ig Dojo util directory exists
if [ -d "$UTILDIR" ]
then
        echo "Util exists"
else
        echo "Can't find Dojo build tools -- did you checkout dojo source modules"
        exit
fi

#Check if profile exists
if [ -f "$PROFILE" ]
then
        echo "profile exists"
else
        echo "Invalid input profile"
        exit
fi

if [ -d "$DISTDIR" ]
then
        echo "removing previously built files"
        \rm -rf {$DISTDIR/app,$DISTDIR/dgrid,$DISTDIR/dijit,$DISTDIR/dojo,$DISTDIR/dojox,$DISTDIR/put-selector,$DISTDIR/xstyle,$DISTDIR/dgrid-new,$DISTDIR/dstore}
fi


echo "Using $PROFILE for dojo build."

echo "Starting Dojo Build"
$UTILDIR/build.sh --bin java --profile $PROFILE  --releaseDir $DISTDIR > build.log 2>&1

BUILDSTATUS="$?"

echo "Dojo build exit code is $BUILDSTATUS"

if [ $BUILDSTATUS -ne 0 ]; then
   cat build.log
   exit $?
fi

echo "Syncing index.html and css,images,external,config directories"

echo "syncing $CSSDIR to $DISTDIR"
rsync -arv --exclude=*/CVS* $CSSDIR $DISTDIR

echo "syncing externalJS files from $EXTERNALJSDIR to $DISTDIR"
rsync -arv --exclude=*/CVS* $EXTERNALJSDIR $DISTDIR

echo "syncing $IMGDIR to $DISTDIR"
rsync -arv --exclude=*/CVS* $IMGDIR $DISTDIR

echo "syncing index html file to $DISTDIR"
rsync $INDEXFILE $DISTDIR

echo "syncing $CONFIGDIR to $DISTDIR"
rsync -arv --exclude=*/CVS* $CONFIGDIR $DISTDIR

echo "Build complete"
