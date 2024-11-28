package main

import (
    "fmt"
    "github.com/pulumi/pulumi-aws/sdk/v5/go/aws"
    "github.com/pulumi/pulumi-aws/sdk/v5/go/aws/ec2"
    "github.com/pulumi/pulumi-aws/sdk/v5/go/aws/lb"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        // Create VPC
        vpc, err := ec2.NewVpc(ctx, "todo-vpc", &ec2.VpcArgs{
            CidrBlock:          pulumi.String("10.0.0.0/16"),
            EnableDnsHostnames: pulumi.Bool(true),
            EnableDnsSupport:   pulumi.Bool(true),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("todo-vpc"),
            },
        })
        if err != nil {
            return err
        }

        // Create Internet Gateway
        igw, err := ec2.NewInternetGateway(ctx, "todo-igw", &ec2.InternetGatewayArgs{
            VpcId: vpc.ID(),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("todo-igw"),
            },
        })
        if err != nil {
            return err
        }

        // Create Public Subnet (Frontend)
        frontendSubnet, err := ec2.NewSubnet(ctx, "frontend-subnet", &ec2.SubnetArgs{
            VpcId:               vpc.ID(),
            CidrBlock:           pulumi.String("10.0.1.0/24"),
            AvailabilityZone:    pulumi.String("us-east-1a"),
            MapPublicIpOnLaunch: pulumi.Bool(true), // Auto-assign public IP
            Tags: pulumi.StringMap{
                "Name": pulumi.String("frontend-subnet-public"),
            },
        })
        if err != nil {
            return err
        }

        // Create Private Subnets
        backendSubnet, err := ec2.NewSubnet(ctx, "backend-subnet", &ec2.SubnetArgs{
            VpcId:            vpc.ID(),
            CidrBlock:        pulumi.String("10.0.2.0/24"),
            AvailabilityZone: pulumi.String("us-east-1b"),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("backend-subnet-private"),
            },
        })
        if err != nil {
            return err
        }

        dbSubnet, err := ec2.NewSubnet(ctx, "db-subnet", &ec2.SubnetArgs{
            VpcId:            vpc.ID(),
            CidrBlock:        pulumi.String("10.0.3.0/24"),
            AvailabilityZone: pulumi.String("us-east-1c"),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("db-subnet-private"),
            },
        })
        if err != nil {
            return err
        }

        // Create Elastic IP for NAT Gateway
        eip, err := ec2.NewEip(ctx, "nat-eip", &ec2.EipArgs{
            Vpc: pulumi.Bool(true),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("nat-eip"),
            },
        })
        if err != nil {
            return err
        }

        // Create NAT Gateway
        natGateway, err := ec2.NewNatGateway(ctx, "todo-nat", &ec2.NatGatewayArgs{
            SubnetId:     frontendSubnet.ID(), // Place NAT Gateway in public subnet
            AllocationId: eip.ID(),
            Tags: pulumi.StringMap{
                "Name": pulumi.String("todo-nat"),
            },
        })
        if err != nil {
            return err
        }

        // Create Public Route Table (for Frontend)
        publicRouteTable, err := ec2.NewRouteTable(ctx, "public-rt", &ec2.RouteTableArgs{
            VpcId: vpc.ID(),
            Routes: ec2.RouteTableRouteArray{
                &ec2.RouteTableRouteArgs{
                    CidrBlock: pulumi.String("0.0.0.0/0"),
                    GatewayId: igw.ID(),
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("public-rt"),
            },
        })
        if err != nil {
            return err
        }

        // Create Private Route Table (for Backend and DB)
        privateRouteTable, err := ec2.NewRouteTable(ctx, "private-rt", &ec2.RouteTableArgs{
            VpcId: vpc.ID(),
            Routes: ec2.RouteTableRouteArray{
                &ec2.RouteTableRouteArgs{
                    CidrBlock:     pulumi.String("0.0.0.0/0"),
                    NatGatewayId:  natGateway.ID(),
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("private-rt"),
            },
        })
        if err != nil {
            return err
        }

        // Associate Route Tables with Subnets
        _, err = ec2.NewRouteTableAssociation(ctx, "frontend-rta", &ec2.RouteTableAssociationArgs{
            SubnetId:     frontendSubnet.ID(),
            RouteTableId: publicRouteTable.ID(),
        })
        if err != nil {
            return err
        }

        _, err = ec2.NewRouteTableAssociation(ctx, "backend-rta", &ec2.RouteTableAssociationArgs{
            SubnetId:     backendSubnet.ID(),
            RouteTableId: privateRouteTable.ID(),
        })
        if err != nil {
            return err
        }

        _, err = ec2.NewRouteTableAssociation(ctx, "db-rta", &ec2.RouteTableAssociationArgs{
            SubnetId:     dbSubnet.ID(),
            RouteTableId: privateRouteTable.ID(),
        })
        if err != nil {
            return err
        }

        // Create Security Groups
        albSg, err := ec2.NewSecurityGroup(ctx, "alb-sg", &ec2.SecurityGroupArgs{
            VpcId: vpc.ID(),
            Ingress: ec2.SecurityGroupIngressArray{
                &ec2.SecurityGroupIngressArgs{
                    Protocol:   pulumi.String("tcp"),
                    FromPort:  pulumi.Int(80),
                    ToPort:    pulumi.Int(80),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
                },
            },
            Egress: ec2.SecurityGroupEgressArray{
                &ec2.SecurityGroupEgressArgs{
                    Protocol:   pulumi.String("-1"),
                    FromPort:  pulumi.Int(0),
                    ToPort:    pulumi.Int(0),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("alb-sg"),
            },
        })
        if err != nil {
            return err
        }

        // Create Frontend Security Group
        frontendSg, err := ec2.NewSecurityGroup(ctx, "frontend-sg", &ec2.SecurityGroupArgs{
            VpcId: vpc.ID(),
            Ingress: ec2.SecurityGroupIngressArray{
                &ec2.SecurityGroupIngressArgs{
                    Protocol:   pulumi.String("tcp"),
                    FromPort:  pulumi.Int(22),
                    ToPort:    pulumi.Int(22),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // Allow SSH from anywhere
                },
            },
            Egress: ec2.SecurityGroupEgressArray{
                &ec2.SecurityGroupEgressArgs{
                    Protocol:   pulumi.String("-1"),
                    FromPort:  pulumi.Int(0),
                    ToPort:    pulumi.Int(0),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("frontend-sg"),
            },
        })
        if err != nil {
            return err
        }

        // Create Backend Security Group
        backendSg, err := ec2.NewSecurityGroup(ctx, "backend-sg", &ec2.SecurityGroupArgs{
            VpcId: vpc.ID(),
            Ingress: ec2.SecurityGroupIngressArray{
                &ec2.SecurityGroupIngressArgs{
                    Protocol:       pulumi.String("tcp"),
                    FromPort:      pulumi.Int(8080),
                    ToPort:        pulumi.Int(8080),
                    SecurityGroups: pulumi.StringArray{albSg.ID()},
                },
                &ec2.SecurityGroupIngressArgs{
                    Protocol:       pulumi.String("tcp"),
                    FromPort:      pulumi.Int(22),
                    ToPort:        pulumi.Int(22),
                    SecurityGroups: pulumi.StringArray{frontendSg.ID()}, // Allow SSH from frontend
                },
            },
            Egress: ec2.SecurityGroupEgressArray{
                &ec2.SecurityGroupEgressArgs{
                    Protocol:   pulumi.String("-1"),
                    FromPort:  pulumi.Int(0),
                    ToPort:    pulumi.Int(0),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("backend-sg"),
            },
        })
        if err != nil {
            return err
        }

        // Create DB Security Group
        dbSg, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
            VpcId: vpc.ID(),
            Ingress: ec2.SecurityGroupIngressArray{
                &ec2.SecurityGroupIngressArgs{
                    Protocol:       pulumi.String("tcp"),
                    FromPort:      pulumi.Int(5432),
                    ToPort:        pulumi.Int(5432),
                    SecurityGroups: pulumi.StringArray{backendSg.ID()},
                },
            },
            Egress: ec2.SecurityGroupEgressArray{
                &ec2.SecurityGroupEgressArgs{
                    Protocol:   pulumi.String("-1"),
                    FromPort:  pulumi.Int(0),
                    ToPort:    pulumi.Int(0),
                    CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
                },
            },
            Tags: pulumi.StringMap{
                "Name": pulumi.String("db-sg"),
            },
        })
        if err != nil {
            return err
        }

        // User data script to install Docker and run frontend container
        frontendUserData := `#!/bin/bash
        apt-get update
        apt-get install -y docker.io
        systemctl enable docker
        systemctl start docker

        # Pull the frontend Docker image
        docker pull your-registry/frontend-image:latest

        # Run the frontend container
        docker run -d --name frontend -p 80:80 your-registry/frontend-image:latest
        `

        // User data script to install Docker and run backend container
        backendUserData := `#!/bin/bash
        apt-get update
        apt-get install -y docker.io
        systemctl enable docker
        systemctl start docker

        # Pull the backend Docker image
        docker pull your-registry/backend-image:latest

        # Run the backend container
        docker run -d --name backend -p 8080:8080 your-registry/backend-image:latest
        `

        // User data script to install and configure the backend load balancer using Nginx
        backendLbUserData := `#!/bin/bash
        apt-get update
        apt-get install -y nginx

        # Configure Nginx
        cat > /etc/nginx/nginx.conf <<EOF
        http {
            upstream backend {
                server {{ backendInstances[0].PrivateIp }}:8080;
                server {{ backendInstances[1].PrivateIp }}:8080;
            }

            server {
                listen 8080;
                location / {
                    proxy_pass http://backend;
                }
            }
        }

        events {}
        EOF

        # Start Nginx
        systemctl start nginx
        systemctl enable nginx
        `

        // User data script to install Docker and run the database container
        dbUserData := `#!/bin/bash
        apt-get update
        apt-get install -y docker.io
        systemctl enable docker
        systemctl start docker

        # Pull the database Docker image
        docker pull your-registry/db-image:latest

        # Run the database container
        docker run -d --name db -p 5432:5432 -e POSTGRES_PASSWORD=your-password your-registry/db-image:latest
        `

        // Create Backend Instances
        backendInstances := make([]*ec2.Instance, 2)
        for i := 0; i < 2; i++ {
            instanceName := fmt.Sprintf("backend-app-%d", i+1)
            instance, err := ec2.NewInstance(ctx, instanceName, &ec2.InstanceArgs{
                Ami:          pulumi.String("ami-053b0d53c279acc90"), // Ubuntu 22.04 LTS AMI ID
                InstanceType: pulumi.String("t2.micro"),
                SubnetId:     backendSubnet.ID(),
                VpcSecurityGroupIds: pulumi.StringArray{backendSg.ID()},
                UserData:     pulumi.String(backendUserData), // Add backend user data script
                Tags: pulumi.StringMap{
                    "Name": pulumi.String(instanceName),
                },
            })
            if err != nil {
                return err
            }
            backendInstances[i] = instance
        }

        // Create Backend Load Balancer Instance
        _, err = ec2.NewInstance(ctx, "backend-lb", &ec2.InstanceArgs{
            Ami:          pulumi.String("ami-053b0d53c279acc90"), // Ubuntu 22.04 LTS AMI ID
            InstanceType: pulumi.String("t2.micro"),
            SubnetId:     backendSubnet.ID(),
            VpcSecurityGroupIds: pulumi.StringArray{backendSg.ID()},
            UserData:     pulumi.String(backendLbUserData), // Add backend load balancer user data script
            Tags: pulumi.StringMap{
                "Name": pulumi.String("backend-lb"),
            },
        })
        if err != nil {
            return err
        }
        // Create Frontend Instance
        _, err = ec2.NewInstance(ctx, "frontend", &ec2.InstanceArgs{
            Ami:          pulumi.String("ami-053b0d53c279acc90"), // Ubuntu 22.04 LTS AMI ID
            InstanceType: pulumi.String("t2.micro"),
            SubnetId:     frontendSubnet.ID(),
            VpcSecurityGroupIds: pulumi.StringArray{frontendSg.ID()},
            UserData:     pulumi.String(frontendUserData), // Add frontend user data script
            Tags: pulumi.StringMap{
                "Name": pulumi.String("frontend"),
            },
        })
        if err != nil {
            return err
        }
        // Create DB Instance
        _, err = ec2.NewInstance(ctx, "db", &ec2.InstanceArgs{
            Ami:          pulumi.String("ami-053b0d53c279acc90"), // Ubuntu 22.04 LTS AMI ID
            InstanceType: pulumi.String("t2.micro"),
            SubnetId:     dbSubnet.ID(),
            VpcSecurityGroupIds: pulumi.StringArray{dbSg.ID()},
            UserData:     pulumi.String(dbUserData), // Add DB user data script
            Tags: pulumi.StringMap{
                "Name": pulumi.String("db"),
            },
        })
        if err != nil {
            return err
        }

        // Export important values
        ctx.Export("vpcId", vpc.ID())
        ctx.Export("frontendSubnetId", frontendSubnet.ID())
        ctx.Export("backendSubnetId", backendSubnet.ID())
        ctx.Export("dbSubnetId", dbSubnet.ID())
        ctx.Export("natGatewayIp", eip.PublicIp)
        ctx.Export("backendInstanceIds", pulumi.StringArray(backendInstances))

        return nil
    })
} 