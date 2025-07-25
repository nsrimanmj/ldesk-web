
echo off

echo starting Build
SET BASEDIR_1=%~dp0

SET BASEDIR=%BASEDIR_1:~0,-1%\..\
echo BASEDIR: %BASEDIR%

@rem Source directory for unbuilt code
SET SRCDIR=%BASEDIR%\src

@rem Directory containing dojo libraries and build utilities

SET UTILDIR=%SRCDIR%\js\util\buildscripts

@rem Destination directory for built code
SET DISTDIR=%BASEDIR%\dist

@rem Main application package build configuration
SET PROFILE=%BASEDIR%\profiles\app.profile.js

@rem CSS files directory
SET CSSDIR=%SRCDIR%\css

@rem EXTERNALJS files directory
SET EXTERNALJSDIR=%SRCDIR%\js\external

@rem CONFIGDIR config fiels directory
SET CONFIGDIR=%SRCDIR%\config

@rem Application images directory
SET IMGDIR=%SRCDIR%\images

@rem index.html file
SET INDEXFILE="%SRCDIR%\index.html"

@rem Checking whether util exists or not
if NOT EXIST %UTILDIR% (
                echo %UTILDIR%
                echo Can't find Dojo build tools -- did you install the dojo source modules
                exit 1
)

@rem checking whether profile exists or not
if NOT EXIST %PROFILE% (
                echo Invalid input profile
                exit 1
)

echo Using %PROFILE%  CSS and IMG will be copied and JS will be built.

echo Cleaning old files...
del /s /q %DISTDIR%
echo Starting Dojo Build

call %UTILDIR%\build.bat --profile %PROFILE%  --releaseDir %DISTDIR% > build.log 2>&1

echo Dojo build exit code is %errorlevel%

if %errorlevel% neq 0 (
   type build.log
   exit /b %errorlevel%
)

echo copying css files from %CSSDIR% to %DISTDIR%
mkdir %DISTDIR%\css
ROBOCOPY %CSSDIR% %DISTDIR%\css /E /MIR /XD "CVS"

echo copying externalJS files from %EXTERNALJSDIR% to %DISTDIR%
mkdir %DISTDIR%\external
ROBOCOPY %EXTERNALJSDIR% %DISTDIR%\external /E /MIR /XD "CVS"

echo copying images from %IMGDIR% to %DISTDIR%
mkdir %DISTDIR%\images
ROBOCOPY %IMGDIR% %DISTDIR%\images /E /MIR /XD "CVS"

echo copying configs from %CONFIGDIR% to %DISTDIR%
mkdir %DISTDIR%\config
ROBOCOPY %CONFIGDIR% %DISTDIR%\config /E /MIR /XD "CVS"

echo copying index file
COPY %INDEXFILE% %DISTDIR%

echo "Build complete"
