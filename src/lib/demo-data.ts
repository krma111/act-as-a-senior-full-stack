import type { Category, Prompt, SiteSettings } from "@/lib/types";

export const demoSettings: SiteSettings = {
  id: 1,
  website_name: "PromptVault",
  logo_text: "PromptVault",
  hero_headline: "Discover and share powerful AI image prompts",
  hero_subheadline: "Browse battle-tested prompts, save favorites, and publish your best image generations.",
  footer_text: "Copyright 2026 PromptVault. All rights reserved.",
  admin_email: "you@example.com"
};

export const demoCategories: Category[] = [
  { id: "portraits", name: "Portraits", slug: "portraits", description: "Editorial and character prompts" },
  { id: "products", name: "Products", slug: "products", description: "Commercial product imagery" },
  { id: "cinematic", name: "Cinematic", slug: "cinematic", description: "Film still and lighting prompts" },
  { id: "architecture", name: "Architecture", slug: "architecture", description: "Spaces, interiors, and exteriors" }
];

export const demoPrompts: Prompt[] = [
  {
    id: "demo-1",
    user_id: "creator-1",
    category_id: "portraits",
    title: "Neon editorial portrait",
    prompt_text: "Editorial close-up portrait, neon rim light, wet pavement reflections, sharp eyes, cinematic color grade, 85mm lens.",
    negative_prompt: "blurry, low quality, distorted face",
    image_url: "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=1200&q=80",
    ai_model: "Midjourney",
    visibility: "public",
    tags: ["portrait", "neon", "editorial"],
    copy_count: 842,
    like_count: 128,
    featured: true,
    hidden: false,
    created_at: new Date().toISOString(),
    categories: demoCategories[0],
    users: { id: "creator-1", email: "maya@example.com", display_name: "Maya Chen", avatar_url: null, role: "user", created_at: new Date().toISOString() }
  },
  {
    id: "demo-2",
    user_id: "creator-2",
    category_id: "products",
    title: "Premium fragrance campaign",
    prompt_text: "Luxury perfume bottle on black marble, softbox reflections, water droplets, amber backlight, high-end commercial photography.",
    negative_prompt: null,
    image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80",
    ai_model: "Stable Diffusion",
    visibility: "public",
    tags: ["product", "luxury", "campaign"],
    copy_count: 511,
    like_count: 94,
    featured: true,
    hidden: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    categories: demoCategories[1],
    users: { id: "creator-2", email: "leo@example.com", display_name: "Leo Park", avatar_url: null, role: "user", created_at: new Date().toISOString() }
  },
  {
    id: "demo-3",
    user_id: "creator-3",
    category_id: "cinematic",
    title: "Rainy sci-fi street scene",
    prompt_text: "Wide cinematic street scene, dense rain, reflective asphalt, holographic signage, volumetric light, anamorphic lens flare.",
    negative_prompt: "flat lighting, cartoon",
    image_url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80",
    ai_model: "Leonardo",
    visibility: "public",
    tags: ["cinematic", "sci-fi", "rain"],
    copy_count: 1204,
    like_count: 217,
    featured: false,
    hidden: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    categories: demoCategories[2],
    users: { id: "creator-3", email: "nora@example.com", display_name: "Nora Vale", avatar_url: null, role: "user", created_at: new Date().toISOString() }
  }
];
