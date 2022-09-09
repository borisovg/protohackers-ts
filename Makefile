all:

rsync:
	rsync -avP \
	--exclude dist \
	--exclude node_modules \
	* boris@cloudbase.gir.me.uk:~/protohackers/

run:
	cd $(DIR) && docker run \
		--init \
		-it \
		-p 10123:10123 \
		--rm \
		$$(docker build -q .); exit 0
