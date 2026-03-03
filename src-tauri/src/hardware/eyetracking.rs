use opencv::{
    core::{self, Scalar, Vector},
    highgui, imgproc, objdetect,
    prelude::*,
    videoio,
};

pub fn debug_eye_tracking() -> opencv::Result<()> {
    println!("Starting eye tracking test...");

    //open camera
    let mut cam = videoio::VideoCapture::new(0, videoio::CAP_ANY)?;
    if !cam.is_opened()? {
        panic!("Can't open camera!");
    }
    println!("Camera opened!");

    //load Haar Cascade (for eyes and face)
    let mut eye_cascade =
        objdetect::CascadeClassifier::new(&core::find_file("haarcascade_eye.xml", true, false)?)?;

    let mut face_cascade = objdetect::CascadeClassifier::new(&core::find_file(
        "haarcascade_frontalface_default.xml",
        true,
        false,
    )?)?;

    // need to add the xml files !
    // https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_eye.xml
    // https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalcatface.xml

    let window = "Eye Tracking Test";
    highgui::named_window(window, highgui::WINDOW_AUTOSIZE)?;

    loop {
        let mut frame = Mat::default();
        cam.read(&mut frame)?;

        if frame.empty() {
            break;
        }

        // mirrors camera, easier to look at
        core::flip(&frame.clone(), &mut frame, 1)?;

        // convert to grayscale
        let mut grey = Mat::default();
        imgproc::cvt_color(
            &frame,
            &mut grey,
            imgproc::COLOR_BGR2GRAY,
            0,
            core::AlgorithmHint::ALGO_HINT_DEFAULT,
        )?;

        //detect face
        let mut faces = Vector::<core::Rect>::new();
        face_cascade.detect_multi_scale(
            &grey,
            &mut faces,
            1.1,                     // scalar factor
            3,                       // min neighbors
            0,                       //flags
            core::Size::new(30, 30), // min size
            core::Size::new(0, 0),   // max size
        )?;

        //eye detection done within face only
        for face in faces.iter() {
            //draw face rectangle
            imgproc::rectangle(
                &mut frame,
                face,
                Scalar::new(255.0, 0.0, 0.0, 0.0), //Blue
                2,
                imgproc::LINE_8,
                0,
            )?;

            //get face region
            let face_roi = Mat::roi(&grey, face)?;

            //detect eyes
            let mut eyes = Vector::<core::Rect>::new();
            eye_cascade.detect_multi_scale(
                &face_roi,
                &mut eyes,
                1.1,                       // scale factor
                2,                         // min neighbors
                0,                         // flags
                core::Size::new(30, 30),   // min size
                core::Size::new(100, 100), // max size
            )?;

            //draw rectangles
            for eye in eyes.iter() {
                let eye_rect =
                    core::Rect::new(face.x + eye.x, face.y + eye.y, eye.width, eye.height);
                imgproc::rectangle(
                    &mut frame,
                    eye_rect,
                    Scalar::new(0.0, 0.0, 255.0, 0.0), // Red
                    2,
                    imgproc::LINE_8,
                    0,
                )?;
            }
        }

        // Show frame
        highgui::imshow("Eye Tracking Test", &frame)?;

        // ESC to exit
        if highgui::wait_key(10)? == 27 {
            println!("Exciting Code!");
            break;
        }
    }

    Ok(())
}
