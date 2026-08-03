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
  {
    name: "Gazem Ali",
    rating: 5,
    date: "3 months ago",
    review: "I went to Lqmah Cafe and honestly had such a good experience. Everyone there is super nice and welcoming, like you feel comfortable right away. The food and drinks were so good, everything tasted fresh and just hit. Customer service was a 10/10 too, they were really sweet and attentive. I’d definitely recommend it and I’m for sure going back.",
    source: "Google Review",
  },
  {
    name: "Quantum Roofing",
    rating: 5,
    date: "3 months ago",
    review: "Best experience I had the cakes were so fresh and verely good 10 out of 10 I recommend this place family oriented and very kind bring my kids here they love everything and the prices are really good",
    source: "Google Review",
  },
  {
    name: "Raheem Abdullah",
    rating: 5,
    date: "Edited a month ago",
    review: "It's a beautiful and well-organized café with a great selection of sandwiches and desserts. I tried one of the sandwiches, and it was fresh and delicious. The pastry was crispy, light, and full of flavor. The service was fast, and the place was clean and peaceful. I'll definitely be back to try more items. Highly recommended!",
    source: "Google Review",
  },
] as const;
