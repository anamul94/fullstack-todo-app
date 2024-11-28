# Variables
IMAGE_NAME := todoapp
IMAGE_TAG := v1.0
CONTAINER_NAME := todoapp

# Your Docker Hub registry (username/repo format)
REGISTRY := suanam

# Default target
.PHONY: all
all: build run

# Build the Docker image
.PHONY: build
build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

# Tag the image for the registry
.PHONY: tag
tag:
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Push the Docker image to the registry
.PHONY: push
push: tag
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Pull the Docker image from the registry
.PHONY: pull
pull:
	docker pull $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Run a container from the Docker image
.PHONY: run
run:
	docker run -d --name $(CONTAINER_NAME) -p 80:80 $(IMAGE_NAME):$(IMAGE_TAG)

# Stop and remove the container
.PHONY: stop
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Clean up the Docker image and container
.PHONY: clean
clean: stop
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) || true
	docker rmi $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG) || true

# Restart the container (stop, remove, and run)
.PHONY: restart
restart: stop run
