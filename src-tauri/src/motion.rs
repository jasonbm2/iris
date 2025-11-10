use image::{DynamicImage, ImageBuffer, Rgba};
use std::sync::Mutex;
use tauri::State;
use base64::Engine;

const THRESHOLD: f32 = 5.0;

pub struct MotionState {
    previous_frame: Mutex<Option<DynamicImage>>,
}

impl MotionState {
    pub fn new() -> Self {
        Self {
            previous_frame: Mutex::new(None),
        }
    }
}

#[derive(serde::Serialize)] //converts to json
pub struct MotionResult {
    motion_detected: bool,
    intensity: f32,
    timestamp: i64,
}

#[tauri::command]
pub fn process_frame(
    frame_data: String,
    state: State<MotionState>,
) -> Result<MotionResult, String> {
    // Remove base64 prefix if present
    let cleaned = frame_data
        .strip_prefix("data:image/png;base64,")
        .unwrap_or(&frame_data);
    
    // Decode base64 to bytes
    let img_data = base64::engine::general_purpose::STANDARD
        .decode(cleaned)
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    
    // Load image from bytes
    let img = image::load_from_memory(&img_data)
        .map_err(|e| format!("Image load error: {}", e))?;
    
    // Convert to grayscale for comparison
    let gray = img.to_luma8();
    
    // Get previous frame
    let mut prev_lock = state.previous_frame.lock().unwrap();
    
    // Calculate motion intensity
    let motion_intensity = if let Some(prev) = prev_lock.as_ref() {
        let prev_gray = prev.to_luma8();
        calculate_frame_difference(&gray, &prev_gray)
    } else {
        0.0 // First frame, no comparison possible
    };
    
    // Store current frame for next comparison
    *prev_lock = Some(img);
    
    // Get timestamp
    let timestamp = chrono::Utc::now().timestamp();
    
    Ok(MotionResult {
        motion_detected: motion_intensity > 5.0, // Adjust this threshold
        intensity: motion_intensity,
        timestamp,
    })
}

fn calculate_frame_difference(
    current: &image::GrayImage,
    previous: &image::GrayImage,
) -> f32 {
    let mut diff_sum = 0u64;
    let mut count = 0u64;
    
    for (p1, p2) in current.pixels().zip(previous.pixels()) {
        let diff = (p1[0] as i32 - p2[0] as i32).abs() as u64;
        diff_sum += diff;
        count += 1;
    }
    
    if count > 0 {
        (diff_sum as f32) / (count as f32)
    } else {
        0.0
    }
}