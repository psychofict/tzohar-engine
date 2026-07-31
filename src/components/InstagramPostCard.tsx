"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { fadeUp } from "@/lib/animations";
import type { InstagramPost } from "@/data/instagram";

interface InstagramPostCardProps {
  post: InstagramPost;
  /** "featured" = large card with overlay text, "compact" = grid item */
  size?: "featured" | "compact";
  index?: number;
}

export default function InstagramPostCard({
  post,
  size = "compact",
  index = 0,
}: InstagramPostCardProps) {
  if (size === "featured") {
    return (
      <motion.a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
        variants={fadeUp}
        whileTap={{ scale: 0.98 }}
      >
        <div className="aspect-[4/3] sm:aspect-square relative">
          <Image
            src={post.image}
            alt={post.highlight}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

          {/* Likes badge */}
          {post.likes > 100 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
              <Heart size={12} className="fill-white" />
              {post.likes >= 1000
                ? `${(post.likes / 1000).toFixed(1)}K`
                : post.likes}
            </div>
          )}

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {post.location && (
              <p className="text-sunset text-xs font-semibold uppercase tracking-wider mb-1.5">
                {post.location}
              </p>
            )}
            <p className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2">
              {post.highlight}
            </p>
            <p className="mt-2 text-white/50 text-xs">{post.date}</p>
          </div>
        </div>
      </motion.a>
    );
  }

  // Compact grid card
  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2 rounded-xl"
      variants={fadeUp}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="aspect-square relative rounded-xl overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow duration-300">
        <Image
          src={post.image}
          alt={post.highlight}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-3 text-white">
            {post.likes > 100 && (
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Heart size={16} className="fill-white" />
                {post.likes >= 1000
                  ? `${(post.likes / 1000).toFixed(1)}K`
                  : post.likes}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="hidden sm:block mt-2 text-xs sm:text-sm font-medium text-ink leading-snug line-clamp-2 group-hover:text-ocean transition-colors">
        {post.highlight}
      </p>
      {post.location && (
        <p className="hidden sm:block mt-0.5 text-[10px] sm:text-xs text-ink-3">
          {post.location}
        </p>
      )}
    </motion.a>
  );
}

/** Grid of Instagram post cards with stagger animation */
export function InstagramPostGrid({
  posts,
  size = "compact",
  columns = "grid-cols-2 sm:grid-cols-3",
  className = "",
}: {
  posts: InstagramPost[];
  size?: "featured" | "compact";
  columns?: string;
  className?: string;
}) {
  return (
    <motion.div
      className={`grid ${columns} gap-2 sm:gap-5 ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {posts.map((post, i) => (
        <InstagramPostCard key={post.shortcode} post={post} size={size} index={i} />
      ))}
    </motion.div>
  );
}
