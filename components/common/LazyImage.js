import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const LazyImage = ({ src, alt, width, height, className, placeholderSrc }) => {
  return (
    <LazyLoadImage
      alt={alt || "Image"}
      src={src}
      effect="blur"
      width={width}
      height={height}
      className={className}
      placeholderSrc={placeholderSrc}
      threshold={300}
      wrapperClassName="lazy-image-wrapper"
    />
  );
};

export default LazyImage;
