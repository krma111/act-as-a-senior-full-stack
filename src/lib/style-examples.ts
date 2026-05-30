export type StyleExample = {
  id: string;
  title: string;
  category: string;
  accent: string;
  prompt: string;
  imageUrl: string;
};

const styles = [
  ["Cinematic Rain Portrait", "Cinematic", "teal rain, soft rim light, reflective street, shallow depth of field"],
  ["Luxury Perfume Editorial", "Product", "black marble, amber edge light, glossy reflections, premium campaign"],
  ["Cyberpunk Street Poster", "Poster", "holographic signs, wet asphalt, magenta and cyan lighting, anamorphic flare"],
  ["Golden Hour Film Still", "Cinematic", "warm sun flare, Kodak film grain, natural skin tones, dreamy background"],
  ["High Fashion Studio", "Fashion", "white cyclorama, sculpted softbox light, couture styling, editorial posture"],
  ["Anime Key Visual", "Anime", "clean line art, vibrant cel shading, dramatic sky, expressive pose"],
  ["Vintage Polaroid", "Retro", "instant film border, faded color, flash shadows, nostalgic texture"],
  ["Noir Detective Scene", "Cinematic", "hard shadows, venetian blinds, smoky room, monochrome contrast"],
  ["Dreamy Pastel Portrait", "Portrait", "soft pastel palette, blooming highlights, airy background, gentle glow"],
  ["Magazine Cover Look", "Editorial", "bold composition, studio polish, clean masthead space, glossy finish"],
  ["Oil Painting Masterpiece", "Fine Art", "layered brushwork, museum lighting, rich pigments, classical pose"],
  ["Fantasy Armor Hero", "Fantasy", "ornate armor, stormy sky, epic backlight, heroic composition"],
  ["Minimal Product Ad", "Product", "single-color set, crisp shadow, centered object, premium negative space"],
  ["Surreal Cloud Room", "Surreal", "floating clouds, impossible interior, soft light, dreamlike scale"],
  ["Streetwear Lookbook", "Fashion", "urban wall, flash photography, relaxed pose, high contrast fabric detail"],
  ["Dark Academia Portrait", "Portrait", "library background, candle glow, tweed textures, moody brown highlights"],
  ["Y2K Pop Poster", "Retro", "chrome typography feel, hot pink accents, glossy plastic, starburst highlights"],
  ["Sci-Fi Pilot Closeup", "Sci-Fi", "helmet reflections, cockpit glow, atmospheric haze, intense eyes"],
  ["Wedding Film Portrait", "Lifestyle", "soft veil light, creamy bokeh, elegant styling, romantic film color"],
  ["Fitness Campaign Shot", "Lifestyle", "dramatic side light, athletic pose, clean shadows, commercial realism"],
  ["Royal Renaissance", "Fine Art", "velvet drapery, ornate jewelry, painterly skin, palace light"],
  ["Coffee Shop Lifestyle", "Lifestyle", "window light, warm wood tones, candid expression, cozy atmosphere"],
  ["K-Pop Album Teaser", "Music", "neon set, polished skin, dramatic styling, high-energy composition"],
  ["Brutalist Architecture", "Architecture", "concrete geometry, hard sunlight, sharp perspective, minimal sky"],
  ["Interior Design Render", "Architecture", "modern furniture, natural light, tactile materials, editorial styling"],
  ["Desert Fashion Story", "Fashion", "windblown fabric, sand dunes, golden haze, cinematic scale"],
  ["Glitch Art Portrait", "Experimental", "RGB split, digital artifacts, sharp face detail, dark background"],
  ["Watercolor Character", "Illustration", "transparent washes, delicate ink, paper texture, gentle color bleed"],
  ["Claymation Character", "3D", "handmade clay texture, soft studio light, miniature set, expressive features"],
  ["Pixar-Style 3D", "3D", "friendly proportions, polished materials, big expressive eyes, warm lighting"],
  ["Chrome Robot Hero", "Sci-Fi", "mirror metal, black studio, bright edge lights, futuristic elegance"],
  ["Botanical Portrait", "Portrait", "lush flowers, natural skin, green shadows, romantic editorial framing"],
  ["Sports Trading Card", "Sports", "dynamic action, stadium lights, bold border space, collectible polish"],
  ["Food Magazine Shot", "Food", "overhead plating, natural texture, appetizing highlights, clean table styling"],
  ["Luxury Car Night Ad", "Automotive", "wet road, city reflections, low angle, dramatic headlight streaks"],
  ["Travel Postcard", "Travel", "sunny landmark, vibrant color, slight film fade, clean postcard composition"],
  ["Editorial Black and White", "Editorial", "strong contrast, sculpted face, minimalist backdrop, timeless fashion"],
  ["Neon Samurai Scene", "Fantasy", "katana silhouette, neon fog, rain sparks, cinematic action lighting"],
  ["Aesthetic Bedroom Selfie", "Lifestyle", "soft lamp glow, mirror composition, cozy details, natural pose"],
  ["Corporate Founder Portrait", "Business", "premium office, confident expression, soft directional light, clean background"],
  ["Podcast Cover Art", "Media", "close crop, expressive lighting, strong negative space, modern cover polish"],
  ["Children Book Illustration", "Illustration", "soft storybook texture, friendly shapes, warm palette, whimsical setting"],
  ["Graffiti Wall Portrait", "Street", "colorful mural, flash pop, sharp outfit detail, urban attitude"],
  ["Ethereal Angelic Glow", "Fantasy", "white fabric, volumetric light, soft haze, serene expression"],
  ["Underwater Dream Shot", "Surreal", "floating fabric, blue caustics, suspended hair, elegant slow motion feel"],
  ["Horror Movie Poster", "Poster", "single harsh light, deep shadows, unsettling composition, gritty texture"],
  ["Retro Futurist Office", "Sci-Fi", "1970s technology, warm panels, curved furniture, analog futurism"],
  ["Beauty Macro Campaign", "Beauty", "dewy skin, precise makeup, glossy highlights, premium cosmetic lighting"],
  ["Skate Video Frame", "Street", "fisheye lens, motion blur, concrete park, raw flash energy"],
  ["Dream Pop Album Cover", "Music", "soft blur, pastel neon, emotional pose, surreal background"],
  ["Fine Jewelry Closeup", "Product", "macro sparkle, velvet surface, tiny highlights, luxury catalog finish"],
  ["Comic Book Splash Page", "Illustration", "bold inks, halftone texture, action pose, dramatic panel energy"],
  ["Mediterranean Vacation", "Travel", "white walls, blue sea, linen outfit, bright summer light"],
  ["Techwear Night Portrait", "Fashion", "black technical fabric, city glow, rain detail, utilitarian styling"],
  ["Mystic Forest Mage", "Fantasy", "ancient trees, glowing runes, cloak movement, magical atmosphere"],
  ["Clean App Store Promo", "Product", "floating device mockup, gradient-free dark set, crisp UI reflection"],
  ["Documentary Street Photo", "Photo", "candid moment, natural grain, layered street scene, honest realism"],
  ["Ballet Stage Portrait", "Performance", "spotlight, flowing fabric, stage haze, elegant motion"],
  ["Snowy Expedition Poster", "Adventure", "whiteout landscape, red jacket accent, cinematic survival mood"],
  ["Pop Art Celebrity", "Illustration", "bold flat colors, screenprint dots, graphic shadows, iconic expression"]
] as const;

export const styleExamples: StyleExample[] = styles.map(([title, category, accent], index) => {
  const id = `style-${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    title,
    category,
    accent,
    imageUrl: `https://picsum.photos/seed/prompthub-${id}/900/1100`,
    prompt: `Use the uploaded reference photo as the subject identity and recreate it in a ${title.toLowerCase()} style: ${accent}. Preserve the person's facial structure, pose, clothing silhouette, and recognizable details while transforming lighting, color grade, background, texture, and camera treatment. High-resolution, premium composition, natural anatomy, detailed face, polished professional finish.`
  };
});
