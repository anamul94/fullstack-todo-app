IMAGE_NAME=todobackend
IMAGE_TAG=v01
CONTAINER_NAME=todobackend
REGISTRY=suanam/todobackend


build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

run:
	docker run -d --name $(CONTAINER_NAME) -p 8080:8080 $(IMAGE_NAME):$(IMAGE_TAG)

stop:
	docker stop $(CONTAINER_NAME)	

clean:
	docker stop $(CONTAINER_NAME)
	docker rm $(CONTAINER_NAME)

logs:
	docker logs -f $(CONTAINER_NAME)

push:
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY):$(IMAGE_TAG)
	docker push $(REGISTRY):$(IMAGE_TAG)

pull:
	docker pull $(REGISTRY):$(IMAGE_TAG)