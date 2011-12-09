A group project for the course "Internet and Web Systems" at University of Massachusetts Lowell Fall 2011.

 - [Application State Historian (ASH)](https://github.com/curran/IWSCourseProject/tree/master/ASH) - Our JavaScript application synchronization framework.
 - [Live demos in the cloud](http://universalvisualization.org:8000/) - Two example ASH applications.
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
     - Use the `c` and `d` keys for zooming.
 - [Presentation](https://docs.google.com/presentation/pub?id=1SYXQqSjGpwKb2GZ8SVdP34-BK9p5tKYcNJ4Dxkch4Vw&start=false&loop=false&delayms=3000) - Slides for our class presentation on 12/7/2011.
 - [Original design document](http://curransoft.com/code/2011/09/application-state-historian/) - A document from the beginning of the semester which states the motivation and goals for the project.
 - [Technology tests leading up to the final implementation](https://github.com/curran/IWSCourseProject/tree/master/tests) - Our development sandbox including self-contained prototypes and technology tests demonstrating various features needed for the final implementation.