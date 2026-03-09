
-- Add casting/connection fields to shop_floor_displays
ALTER TABLE public.shop_floor_displays
  ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS bluetooth_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bluetooth_device_name text,
  ADD COLUMN IF NOT EXISTS cast_protocol text;

COMMENT ON COLUMN public.shop_floor_displays.connection_type IS 'How the display connects: url, ip, bluetooth';
COMMENT ON COLUMN public.shop_floor_displays.ip_address IS 'IP address for network casting (Chromecast, smart TV)';
COMMENT ON COLUMN public.shop_floor_displays.bluetooth_enabled IS 'Whether Bluetooth pairing is enabled';
COMMENT ON COLUMN public.shop_floor_displays.bluetooth_device_name IS 'Name of paired Bluetooth device';
COMMENT ON COLUMN public.shop_floor_displays.cast_protocol IS 'Casting protocol: chromecast, miracast, airplay, custom';
