## Service Technician Mobile App
-----



This project uses cordova (previously phonegap).

To build this project, you will need the following:

Android SDK (latest)
IOS SDK (latest, on Mac)
nodejs 0.10.26+
cordova (3.4 +) (nodejs plugins installed via node package manager)

Steps

0. Download and install android sdk and/or iOS sdk
1. Install nodejs 0.10.26+ via apt-get on linux
2. Once installed it will also install npm
3. Install cordova: sudo npm install -g cordova
4. Connect your android phone via a usb cable. Make sure usb debugging is on.

5. If this is the first time you are building, an additional step is required:
```
$> ./initialize android | ios
$> gulp build
```

7. cd into cordova-app directory and then type:
```
$> cordova run android
```
