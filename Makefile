.PHONY: build
build:
	rm -rf build docs
	yarn build
	mv build docs # for gh pages
