// Listen-only keyboard tap so the floating map can light up pressed keys.
// Needs macOS Input Monitoring permission; emits ("key-event", (mac_keycode, down)).

#[cfg(target_os = "macos")]
mod imp {
    use core_foundation::runloop::CFRunLoop;
    use core_graphics::event::{
        CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
        CGEventType, CallbackResult, EventField,
    };
    use std::sync::atomic::{AtomicBool, Ordering};
    use tauri::{AppHandle, Emitter};

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGPreflightListenEventAccess() -> bool;
        fn CGRequestListenEventAccess() -> bool;
    }

    static STARTED: AtomicBool = AtomicBool::new(false);

    // Modifier keys arrive as FlagsChanged; their "down" state is the flag bit.
    fn modifier_flag(keycode: i64) -> Option<CGEventFlags> {
        match keycode {
            0x37 | 0x36 => Some(CGEventFlags::CGEventFlagCommand),
            0x38 | 0x3C => Some(CGEventFlags::CGEventFlagShift),
            0x3A | 0x3D => Some(CGEventFlags::CGEventFlagAlternate),
            0x3B | 0x3E => Some(CGEventFlags::CGEventFlagControl),
            _ => None,
        }
    }

    pub fn start(app: AppHandle) -> Result<(), String> {
        if !unsafe { CGPreflightListenEventAccess() } {
            unsafe { CGRequestListenEventAccess() };
            return Err("needs-permission".into());
        }
        if STARTED.swap(true, Ordering::SeqCst) {
            return Ok(());
        }
        std::thread::spawn(move || {
            let res = CGEventTap::with_enabled(
                CGEventTapLocation::HID,
                CGEventTapPlacement::HeadInsertEventTap,
                CGEventTapOptions::ListenOnly,
                vec![CGEventType::KeyDown, CGEventType::KeyUp, CGEventType::FlagsChanged],
                |_proxy, etype, event| {
                    let code = event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);
                    let down = match etype {
                        CGEventType::KeyDown => Some(true),
                        CGEventType::KeyUp => Some(false),
                        CGEventType::FlagsChanged => {
                            modifier_flag(code).map(|f| event.get_flags().contains(f))
                        }
                        _ => None,
                    };
                    if let Some(down) = down {
                        let _ = app.emit("key-event", (code, down));
                    }
                    CallbackResult::Keep
                },
                || CFRunLoop::run_current(),
            );
            if res.is_err() {
                STARTED.store(false, Ordering::SeqCst);
            }
        });
        Ok(())
    }
}

#[tauri::command]
pub fn start_key_watch(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return imp::start(app);
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Err("unsupported".into())
    }
}
