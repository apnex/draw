## `draw`

Prototype interactive SVG frontend UI for the `path` API system

![draw-ui](topology1.svg)

Live demo at: http://draw.apnex.io  

### Install
For local development / testing - use `http-server` to serve the local files:
```
npm install -g http-server
```

#### Start the web server:
```
./server.sh
```

You should now be able to access the UI on `http://localhost:8080`

### Usage
- Click and hold `right-click` on the dock and drag mouse to `create` new `node` onto page
- Click and hold `right-click` on an existing `node` and drag mouse to move it
- Hold `ALT + right-click` on a `node` to `delete` it, along with all connected `links`
- Hold `CTRL + right-click` on a `node` to `copy` it, then drag mouse to new location
- Hold `left-click` on a `node` and drag mouse to create a new `link` between 2 nodes
