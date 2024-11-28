import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Configuration
const config = new pulumi.Config();
const environment = config.require("environment");
const dockerHubUsername = config.require("dockerHubUsername");

// VPC Configuration
const vpc = new awsx.ec2.Vpc("todo-app-vpc", {
    numberOfAvailabilityZones: 2,
    numberOfNatGateways: 1,
});

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup("alb-sg", {
    vpcId: vpc.vpcId,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

const ec2SecurityGroup = new aws.ec2.SecurityGroup("ec2-sg", {
    vpcId: vpc.vpcId,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Create Launch Template
const launchTemplate = new aws.ec2.LaunchTemplate("app-launch-template", {
    name: "todo-app-template",
    imageId: "ami-0c55b159cbfafe1f0", // Amazon Linux 2 AMI
    instanceType: "t2.micro",
    networkInterfaces: [{
        associatePublicIpAddress: true,
        securityGroups: [ec2SecurityGroup.id],
    }],
    userData: Buffer.from(`
        #!/bin/bash
        yum update -y
        yum install -y docker
        systemctl start docker
        systemctl enable docker
        docker pull your-docker-hub-username/todo-frontend:latest
        docker pull your-docker-hub-username/todo-backend:latest
        docker run -d -p 80:80 your-docker-hub-username/todo-frontend:latest
        docker run -d -p 3000:3000 your-docker-hub-username/todo-backend:latest
    `).toString("base64"),
    tags: {
        Name: "todo-app-template"
    }
});

// Create Auto Scaling Group
const asg = new aws.autoscaling.Group("app-asg", {
    vpcZoneIdentifiers: vpc.publicSubnetIds,
    targetGroupArns: [frontendTargetGroup.arn, backendTargetGroup.arn],
    healthCheckType: "ELB",
    healthCheckGracePeriod: 300,
    desiredCapacity: 2,
    maxSize: 4,
    minSize: 2,
    launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest"
    },
    tags: [{
        key: "Name",
        value: "todo-app-instance",
        propagateAtLaunch: true
    }]
});

// Create Application Load Balancer
const alb = new aws.lb.LoadBalancer("app-alb", {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: vpc.publicSubnetIds,
    enableDeletionProtection: false,
    tags: {
        Name: "todo-app-alb"
    }
});

// Create Target Groups
const frontendTargetGroup = new aws.lb.TargetGroup("frontend-tg", {
    port: 80,
    protocol: "HTTP",
    vpcId: vpc.vpcId,
    healthCheck: {
        enabled: true,
        path: "/",
        port: "80",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200"
    }
});

const backendTargetGroup = new aws.lb.TargetGroup("backend-tg", {
    port: 3000,
    protocol: "HTTP",
    vpcId: vpc.vpcId,
    healthCheck: {
        enabled: true,
        path: "/health",
        port: "3000",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200"
    }
});

// Create ALB Listeners
const httpListener = new aws.lb.Listener("http-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: frontendTargetGroup.arn
    }]
});

// Create listener rule for backend API paths
const apiListenerRule = new aws.lb.ListenerRule("api-listener-rule", {
    listenerArn: httpListener.arn,
    priority: 1,
    actions: [{
        type: "forward",
        targetGroupArn: backendTargetGroup.arn
    }],
    conditions: [{
        pathPattern: {
            values: ["/api/*", "/health"]
        }
    }]
});

// Export the ALB DNS name
export const albDnsName = alb.dnsName; 