const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const snapSoundElement = document.getElementById('snapSound');
const webcam = new Webcam(webcamElement, 'user', canvasElement, snapSoundElement);
const camera_btn = $("#camera_btn");
const flip_btn = $("#flip_btn");

webcam.start()
   .then(result => {
      camera_btn.click(() => {
        console.log("picture taken");
        let picture = webcam.snap();
      });

      flip_btn.click(() => {
          console.log('flipped');
        webcam.flip();
      });
   })
   .catch(err => {
       console.log(err);
   });