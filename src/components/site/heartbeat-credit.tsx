"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const FULL_TEXT = "Dibuat oleh hati, dengan hati-hati, untuk orang yang selalu ada di hati.";

/** Each "hati" in the credit line swaps for its own heart-emoji run. */
const SEGMENTS = [
  { text: "hati", heart: "❤️" },
  { text: "hati-hati", heart: "❤️❤️" },
  { text: "hati", heart: "❤️❤️❤️❤️❤️" },
];

/** Text dwells longer so it's actually readable; the heart is a quick wink, not a strobe. */
const TEXT_DWELL_MS = 4000;
const HEART_DWELL_MS = 1000;

function HeartSegment({
  text,
  heart,
  showHeart,
  reduceMotion,
}: {
  text: string;
  heart: string;
  showHeart: boolean;
  reduceMotion: boolean | null;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={showHeart ? "heart" : "text"}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="inline-block"
      >
        {showHeart ? heart : text}
      </motion.span>
    </AnimatePresence>
  );
}

/** Alternates each "hati" in the footer credit line with a heart emoji. */
export function HeartbeatCredit() {
  const [showHeart, setShowHeart] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setTimeout(
      () => setShowHeart((prev) => !prev),
      showHeart ? HEART_DWELL_MS : TEXT_DWELL_MS,
    );
    return () => clearTimeout(id);
  }, [showHeart]);

  return (
    <p className="mt-3 font-serif text-lg leading-snug text-amber-800 italic">
      {/* Screen readers always get the plain sentence, regardless of what's visually toggling. */}
      <span className="sr-only">{FULL_TEXT}</span>
      <span aria-hidden="true">
        Dibuat oleh{" "}
        <HeartSegment {...SEGMENTS[0]} showHeart={showHeart} reduceMotion={reduceMotion} />, dengan{" "}
        <HeartSegment {...SEGMENTS[1]} showHeart={showHeart} reduceMotion={reduceMotion} />, untuk orang
        yang selalu ada di <HeartSegment {...SEGMENTS[2]} showHeart={showHeart} reduceMotion={reduceMotion} />.
      </span>
    </p>
  );
}
