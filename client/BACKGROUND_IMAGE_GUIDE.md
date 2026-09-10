# Background Image Setup Guide

## ✅ Current Setup

Your background image is now displayed on the homepage hero section!

**File**: `public/mut-background image.jfif`
**Location**: Hero section (top banner)
**Effect**: Green overlay with background image

## 🎨 How It Works

The background image is displayed with:
- ✅ Green gradient overlay (matches MUT theme)
- ✅ Blend mode for better text visibility
- ✅ Responsive design (works on all screen sizes)
- ✅ Cover mode (fills entire hero section)

## 🚀 Optional: Optimize Performance

For better loading speed, you can:

### Option 1: Rename the file (remove spaces)
1. Rename: `mut-background image.jfif` → `mut-background.jpg`
2. Update in HomePage.jsx line ~8:
   ```javascript
   backgroundImage: "..., url('/mut-background.jpg')"
   ```

### Option 2: Convert to WebP (best performance)
1. Use online converter: https://cloudconvert.com/jfif-to-webp
2. Save as `mut-background.webp`
3. Update HomePage.jsx:
   ```javascript
   backgroundImage: "..., url('/mut-background.webp')"
   ```

### Option 3: Compress the image
- Use https://tinypng.com/ or similar
- Reduces file size without losing quality
- Faster page load

## 🎨 Customization Options

### Change overlay color:
In `HomePage.jsx`, modify the RGBA values:
```javascript
backgroundImage: "linear-gradient(rgba(22, 163, 74, 0.85), rgba(5, 150, 105, 0.85)), url('...')"
//                                                  ^^^^                            ^^^^
//                                                  Opacity (0.0 to 1.0)
```

- **0.5** = Light overlay (more background visible)
- **0.85** = Medium overlay (current)
- **0.95** = Heavy overlay (less background visible)

### Change to different overlay color:
```javascript
// Red overlay
backgroundImage: "linear-gradient(rgba(220, 38, 38, 0.85), rgba(185, 28, 28, 0.85)), url('...')"

// Blue overlay
backgroundImage: "linear-gradient(rgba(37, 99, 235, 0.85), rgba(29, 78, 216, 0.85)), url('...')"

// Keep green (MUT theme)
backgroundImage: "linear-gradient(rgba(22, 163, 74, 0.85), rgba(5, 150, 105, 0.85)), url('...')"
```

### Remove overlay completely:
```javascript
style={{
  backgroundImage: "url('/mut-background image.jfif')"
}}
```

## 📐 Adjust Background Position

If the image doesn't look centered:

In `HomePage.jsx`, add to the style object:
```javascript
style={{
  backgroundImage: "...",
  backgroundPosition: "center center", // Options: "top", "bottom", "left", "right"
  backgroundSize: "cover" // Options: "contain", "100%", "auto"
}}
```

## 🎯 Test Different Devices

View the page on:
- ✅ Desktop (large screens)
- ✅ Tablet (medium screens)
- ✅ Mobile (small screens)

The background automatically adapts!

## 🔧 Troubleshooting

### Image not showing?
1. Check file is in `client/public/` folder
2. Restart dev server: `npm run dev`
3. Clear browser cache: Ctrl+Shift+R (Windows)

### Image too large/slow?
1. Compress with TinyPNG
2. Resize to max 1920x1080px
3. Convert to WebP format

### Text hard to read?
1. Increase overlay opacity: `0.85` → `0.95`
2. Add text shadow (already added with `drop-shadow`)

## 📝 Current Settings

```javascript
// Hero Section with Background
className: "relative bg-gradient-to-r from-mut-primary to-mut-secondary 
            text-white py-16 bg-cover bg-center bg-no-repeat"

style: {
  backgroundImage: "linear-gradient(rgba(22, 163, 74, 0.85), 
                   rgba(5, 150, 105, 0.85)), 
                   url('/mut-background image.jfif')",
  backgroundBlendMode: 'multiply'
}
```

Your homepage now has a beautiful background! 🎨✨
