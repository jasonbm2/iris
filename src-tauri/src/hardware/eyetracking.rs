use opencv::{
    core::{self, Scalar},
    highgui, imgproc, objdetect,
    prelude::*,
    types, videoio,
};

pub fn debug_eye_tracking() -> opencv::Result<()> {
    //opens camera
    let mut cam = videoio::VideoCapture::new(0, videoio::CAP_ANY)?;
    if !cam.is_opened()? {
        panic!("Can't open camera.");
    }

    //load Haar Cascade
    let eye_cascade = objdetect::CascadeClassifier::new(&core::find_file(
        "haarcascades/haarcascade_eye.xml",
        true,
        false,
    )?)?;

    loop {
        //loops through the frames
        let mut frame = Mat::default();
        cam.read(&mut frame)?;
        if frame.empty()? {
            break;
        }

        //converts to greyscale (eyes detected better)
        let mut grey = Mat::default();
        imgproc::cvt_color(
            &frame,
            &mut grey,
            imgproc::COLOR_BGR2GRAY,
            0,
            core::AlgorithmHint::default(),
        )?;

        //detect eyes in frame
        let mut eyes = types::VectorOfRect::default();
        eye_cascade.detect_multi_scale(
            &grey,
            &mut eyes,
            1.1,                            // scale factor
            2,                              // min neighbors
            objdetect::CASCADE_SCALE_IMAGE, // flags
            core::Size::new(30, 30),        // min size
            core::Size::new(100, 100),      // max size
        )?;

        //draw rectangles around detected eyes
        for eye in eyes.iter() {
            imgproc::rectangle(
                &mut frame,
                eye,
                Scalar::new(0.0, 255.0, 0.0, 0.0), // green rectangle
                2,
                imgproc::LINE_8,
                0,
            )?;
        }

        //show the frame
        highgui::imshow("Eye Tracking Debug", &frame)?;
        if highgui::wait_key(10)? >= 27 {
            break;
        }
    }
    highgui::destroy_window("Eye Tracking Debug")?;
    Ok(())
}
