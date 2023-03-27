import loaderStyles from "./Loader.module.css";

export type ButtonLoaderProps = {
  /**
   * What color should the loader/spinner be?
   */
  color?: "primary" | "secondary";
  /**
   * How large is this button?
   */
  size?: "small" | "large";
};

/**
 * Primary UI component for user interaction
 */
export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  size,
  color = "primary",
}) => (
  // To-do: Change to proper loader once designs are finished
  <div className="flex flex-row">
    <div
      className={`rounded-full ${loaderStyles.btnLoader} ${
        color === "primary"
          ? loaderStyles.btnLoaderLight
          : loaderStyles.btnLoaderDark
      } ${
        size === "small" ? loaderStyles.btnLoaderXs : loaderStyles.btnLoaderSm
      } ${loaderStyles.animateSpin}`}
    />
  </div>
);
