all:

rsync:
	rsync -avP \
	--delete \
	--exclude coverage \
	--exclude dist \
	--exclude node_modules \
	* boris@cloudbase.gir.me.uk:~/protohackers/

run:
	cd packages/$(DIR) && docker run \
		--init \
		-it \
		-p 10123:10123/tcp \
		-p 10123:10123/udp \
		--rm \
		$$(docker build -q .); exit 0
