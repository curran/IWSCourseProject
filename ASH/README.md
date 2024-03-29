# Application State Historian (ASH)

ASH is a framework for real time Javascript application synchronization. This means that with ASH, you can develop HTML5 apps whose running instances can be shared by many people at once - when one person makes a change, that change is broadcast to all other users, maintaining synchronized application states across multi-platform clients (desktops, smartphones and tablets).

ASH has two parts, the [client library](https://github.com/curran/IWSCourseProject/blob/master/ASH/static/js/ash.js) and the [server](https://github.com/curran/IWSCourseProject/blob/master/ASH/app.js). The ASH server is written in Javascript using the [Node.js](http://nodejs.org/) server side Javascript runtime and the [Express](http://expressjs.com/) Web framework. The client is a Javascript library intended for use by HTML5 applications. Both sides depend on the [Socket.io Node module](http://socket.io/ "Socket.io") for realtime communication.

## Running the examples

To run the ASH server and serve several example applications found in the static/examples directory, do the following:

 1. [Install Node.js](https://github.com/joyent/node/wiki/Installation)
 2. [Install NPM](http://npmjs.org/)
 3. Use NPM to install packages required by the ASH server with the following command:
   - `npm install express socket.io lazy`
 4. [Install Git](http://git-scm.com/download)
 5. Get the ASH source code from GitHub using Git:
   - `git clone git://github.com/curran/IWSCourseProject.git`
   - `cd IWSCourseProject/ASH`
 6. Run the server with the following command:
   - `node app.js`
 7. Access the example applications:
   - access http://localhost:8000/
   - Both examples have the following features:
     - The URLs for accessing the applications are of the form `applicationName/sessionName`.
       - You can enter your own session name to create new sessions.
       - Everyone with the same URL loaded sees the same thing.
       - Updates occur in real time.
   - Colored Circles - [code](https://github.com/curran/IWSCourseProject/blob/master/ASH/static/examples/ColoredCircles.html) - [demo](http://universalvisualization.org:8000/ColoredCircles/test) - A basic application demonstrating the capabilities of ASH.
     - Click on empty space to create a randomly colored circle.
     - Click on a circle to delete it.
     - Click and drag a circle to move it.
   - Infinite Paper - [code](https://github.com/curran/IWSCourseProject/blob/master/ASH/static/examples/InfinitePaper.html) - [demo](http://universalvisualization.org:8000/InfinitePaper/test) - An infinitely zoomable canvas for arranging multi-scale text labels with connections.
     - Click on empty space to create a new text label. You will be prompted to enter text.
     - Right click on a text label to delete it.
     - Use the arrow keys for panning.
     - Use the `c` and `d` keys for zooming, or use pinch-zoom on multi-touch devices (only tested on iPad).

## Architecture
In the Model View Controller paradigm, ASH is responsible for managing the Model. Applications which use ASH must always go through the ASH API to make any changes to their Model. This is how ASH can accomplish full application model management.

Concepts:

 - ASH model: A set of ASH resources. This serves as the full application state model.
 - ASH resource: An instance of a resource type provided by an ASH plugin. Each resource has an Id, a type, and can have named properties assigned to it.
 - ASH plugin: An object which is responsible for managing the lifecycle of ASH resources of one particular type. ASH plugins must be registered with the ASH runtime. After a plugin is registered, it can be accessed through the ASH API within ASH transactions.
 - ASH transaction: An ordered list of ASH actions which are to be executed together atomically.
 - ASH action: A manipulation of an ASH model. ASH actions have the following forms:
   - Set(resourceID, property, value)
     - When `property == "Type"`, the ASH plugin for that type is called upon to instantiate an ASH resource. Further Set actions are handled by the ASH resource generated by the plugin.
   - Unset(resourceID, property)
     - When `property == "Type"`, the resource is deleted. Resource deletion and cleanup is another responsibility of  ASH plugins.
 - ASH session history graph: A directed acyclic graph where nodes are ASH session states and edges are ASH session state transitions.
 - ASH session state: One particular state of an ASH model. A node in an ASH session history graph. Each session state has an Id unique within its containing session history graph.
 - ASH session state transition: A data structure connecting two ASH session states, containing the following:
   - u: The id of the session state this transition is going from.
   - v: The id of the session state this transition is going to.
   - do: An ASH transaction which when executed mutates an ASH model at session state u to session state v.
   - undo: An ASH transaction which when executed mutates an ASH model at session state v to session state u.

When all of these concepts are implemented, ASH will be able to manage state for arbitrary Javascript applications, providing the following features:

 - Synchronous collaboration: Many clients synchronized in real time.
 - Asynchronous collaboration: Publication of session states to the Web for
   - embedding within Web pages,
   - execution as full screen apps,
   - providing a starting point for future synchronous collaboration sessions.
 - Session history navigation: Undo, Redo, and navigation to any state in the session history graph.

ASH is work in progress - only synchronous collaboration is implemented. However, applications written to the current ASH API will gain the the additional features transparently as ASH is developed further (requiring no code modification).

## Public API
The [ASH client library](https://github.com/curran/IWSCourseProject/blob/master/ASH/static/js/ash.js) exports a single global variable `ASH`, which exposes the following methods:
### ASH.registerPlugin(plugin)
Registers an ASH plugin with the ASH runtime.

Args:

 - `plugin` An object expected to contain the following members:
   - `type` A string Id of the ASH resource type provided by this plugin.
   - `create(resourceId)` A factory method for creating ASH resources. This function takes one argument, the Id of the resource being created. This function should have a side effect of creating a resource managed by the plugin, and should return an object containing the following members:
     - `set(property,value)` Sets the given property (a String) to the given value (also a String) on this resource.
     - `unset(property)` Unsets the given property (a String) on this resource.
   - `delete(resourceId)` A method for deleting previously created resources (really deleting, i.e. freeing memory).

### ASH.genResourceId(callback)
Generates a new unique ASH resource Id (a String). 

Args:

 - `callback` A callback function called with the resource Id as a single argument. In some cases Id generation will require a round trip to the ASH server, in which case the callback is called asynchronously, but most of the time it will be called right away. This is because when each client connects to the ASH server it requests a range of integers it can use for new resource Ids. When a client uses all resource Ids in its assigned range, it requests a new range of Ids from the server (the asynchronous case).

### ASH.begin() and ASH.end()
Calling `ASH.begin()` begins an ASH transaction. Subsequent calls to `ASH.set` and `ASH.unset` will be grouped together into an ASH transaction until `ASH.end()` is called, which ends an ASH transaction. If the application is part of a synchronous collaboration session, the transaction actions are broadcast to other clients when `ASH.end()` is called.

### ASH.set(resource,property,value)
Sets the given property of the given resource to the given value in the ASH model. This must be called within an ASH transaction (after `ASH.begin()` and before `ASH.end()`).

Args:

 - `resource` A resource Id
 - `property` A string property Id.
 - `value` A string value.

If `property` is `ASH.TYPE`, then `value` is interpreted to be a type Id (as defined as `plugin.type` in a previous call to `registerPlugin(plugin)`), and setting this property causes ASH to invoke `plugin.create(resourceId)` on the plugin corresponding to the type.

If `property` is not `ASH.TYPE`, it is assumed that the property `ASH.TYPE` has been previously set, and ASH will set the property on the existing resource (meaning it will call `set()` on the object returned previously from `plugin.create()`).

### ASH.unset(resource,property)
Unsets the given property of the given resource.

Args:

- `resource` A string resource Id
 - `property` A string property Id.

If `property` is `ASH.TYPE`, then unsetting this property causes ASH to invoke `plugin.delete(resourceId)` on the plugin corresponding to the type of `resource`, deleting the resource.

If `property` is not `ASH.TYPE`, ASH will unset the property on the resource (meaning it will call `unset()` on the object returned previously from `plugin.create()`).

### ASH.TYPE
The constant property ID used for the type property.
