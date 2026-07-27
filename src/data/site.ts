export const navigation = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About Us", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Contact", href: "/contact" },
] as const;

export const business = {
  address: "Address to be confirmed",
  phone: "Phone to be confirmed",
  email: "Email to be confirmed",
  hours: ["Opening hours to be confirmed"],
  directionsUrl: "#",
} as const;

export const socials = [
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
] as const;

export const testimonials = [
  { name: "Guest name", rating: 5, review: "Placeholder review: replace with verified guest feedback.", source: "Source pending" },
  { name: "Guest name", rating: 5, review: "Placeholder review: warm service and memorable flavors will be highlighted here.", source: "Source pending" },
  { name: "Guest name", rating: 5, review: "Placeholder review: replace with an approved and attributed customer review.", source: "Source pending" },
] as const;
