"use strict";

const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

let size = "t2.nano"; // t2.micro is available in the AWS free tier

// Define an async function to fetch the AMI
async function getAmiId() {
    try {
        const ami = await aws.getAmi({
            filters: [
                { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] }, // Updated filter for Amazon Linux 2
            ],
            owners: ["137112412989"], // Amazon
            mostRecent: true,
        });
        return ami.id;
    } catch (error) {
        pulumi.log.error("Failed to fetch AMI: ", error);
        throw error; // Re-throw the error after logging
    }
}

// Use the async function to get the AMI ID
getAmiId().then(amiId => {
    // Create a new security group for port 80
    let group = new aws.ec2.SecurityGroup("web-secgrp", {
        ingress: [
            { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
            { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        ],
    });

    // (Optional) Create a simple web server using the startup script for the instance
    let userData =
        `#!/bin/bash
echo "Hello, World!" > index.html
nohup python -m SimpleHTTPServer 80 &`;

    let server = new aws.ec2.Instance("web-server-www", {
        tags: { "Name": "web-server-www" },
        instanceType: size,
        vpcSecurityGroupIds: [group.id], // reference the group object above
        ami: amiId, // Use the fetched AMI ID
        userData: userData, // start a simple web server
    });
}).catch(error => {
    console.error("Error in stack setup: ", error);
});


exports.publicIp = server.publicIp;
exports.publicHostName = server.publicDns;
exports.testOutput = "testOutput";
