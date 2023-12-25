space2d3
========

TODO

Development
-----------

To start a dev server, run:

    esbuild --bundle ./src/index.js --outfile=script.js --sourcemap --watch --servedir=.

and open http://localhost:8000/

To produce a ready-to-be-shipped `script.js` file, run:

    esbuild --bundle ./src/index.js --outfile=script.js --sourcemap --minify

[pb]: https://pocketbase.io/

