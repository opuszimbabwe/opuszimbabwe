// A small textured accent keeps administrator-written headings intact.
export default function AccentHeadingText({ text }: { text: string }) {
  const [accent, ...rest] = text.split(' ');
  return <><span className="textured-accent">{accent}</span>{rest.length > 0 && ` ${rest.join(' ')}`}</>;
}
