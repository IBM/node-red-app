Node-RED IBM Cloud Starter Application
====================================

### Node-RED on IBM Cloud

This Node-RED application can be deployed into IBM Cloud with a few clicks. Use this link to navigate to the [IBM Cloud Starter Kit console](https://cloud.ibm.com/developer/appservice/starter-kits) and select the `Node-RED` Starter Kit tile. After you create your app, set up continuous delivery with a DevOps toolchain to deploy your app to IBM Cloud. The code from this repo will be automatically cloned and an instance of Cloudant will be provisioned and bound to your Node-RED application. This is where your Node-RED instance will store its data.

### How does this work?

When you first access the application, you'll be asked to set some security options to ensure your flow editor remains secure from unauthorised access.

It includes a set of default flows that are automatically deployed the first time Node-RED runs.

### Customising Node-RED

This repository is here to be cloned, modified and re-used to allow anyone to create their own Node-RED based application that can be quickly deployed to IBM Cloud.

The default flows are stored in the `defaults` directory in the file called `flow.json`. When the application is first started, this flow is copied to the bound Cloudant instance. When a change is deployed from the editor, the version in cloudant will be updated - not this file.

The web content you get when you go to the application's URL is stored under the `public` directory.

Additional nodes can be added to the `package.json` file and all other Node-RED configuration settings can be set in `bluemix-settings.js`.

