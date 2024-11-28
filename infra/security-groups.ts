import * as aws from "@pulumi/aws";

// ALB Security Group
export const albSecurityGroup = new aws.ec2.SecurityGroup("alb-sg", {
    vpcId: vpc.vpcId,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"]
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"]
        }
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: {
        Name: "todo-alb-sg"
    }
});

// EC2 Security Group
export const ec2SecurityGroup = new aws.ec2.SecurityGroup("ec2-sg", {
    vpcId: vpc.vpcId,
    description: "Security group for EC2 instances",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id]
        },
        {
            protocol: "tcp",
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id]
        }
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: {
        Name: "todo-ec2-sg"
    }
}); 