const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

let size = "t2.nano"; // t2.micro is available in the AWS free tier

// Define an async IIFE (Immediately Invoked Function Expression) to set up resources
(async () => {
    try {
        // Get the id for the latest Amazon Linux 2 AMI
        let ami = await aws.getAmi({
            filters: [
                { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] }, // Updated filter for Amazon Linux 2
            ],
            owners: ["137112412989"], // Amazon
            mostRecent: true,
        });

        // Create a new security group for port 80 and 22
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

        // Create the EC2 instance with the fetched AMI ID and defined security group
        let server = new aws.ec2.Instance("web-server-www", {
            tags: { "Name": "web-server-www" },
            instanceType: size,
            vpcSecurityGroupIds: [group.id], // Reference the group object above
            ami: ami.id, // Use the fetched AMI ID
            userData: userData, // Start a simple web server
        });

        // At this point, all resources have been created successfully


    } catch (error) {
        console.error("Error in stack setup: ", error);
        throw error; // Re-throw the error after logging
    }
})();
