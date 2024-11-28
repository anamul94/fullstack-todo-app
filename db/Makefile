# Image name and tag
IMAGE_NAME := tododb
IMAGE_TAG := latest
CONTAINER_NAME := tododb

# Docker registry (optional)
REGISTRY := docker.io/suanam

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

# Push the Docker image to a registry
push:
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Pull the Docker image from a registry
pull:
	docker pull $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Run a container from the Docker image
run:
	docker run -d --name $(CONTAINER_NAME) -p 5434:5432 $(IMAGE_NAME):$(IMAGE_TAG)

# Stop the container
stop:
	docker stop $(CONTAINER_NAME)

# Clean up the Docker image and container
clean:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) || true
