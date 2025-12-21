import { Gift } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CardComponent({
  item,
  product,
  isReward,
  disabled,
  onClick,
  canRedeem,
}) {
  const [hovered, setHovered] = useState(false);
  const {t,i18n }=useTranslation();
  const lang = i18n.language;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${
        !isReward
          ? "opacity-100"
          : canRedeem(item.pointsRequired)
          ? "opacity-100"
          : "opacity-70"
      }
        group cursor-pointer rounded-xl shadow-md md:hover:translate-y-2 md:relative
          bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 flex 
         ${isReward ? "sm:justify-between hover:shadow-secondary/20  h-20 sm:h-50 sm:flex sm:flex-col" : "lg:flex lg:flex-col hover:shadow-primary/20 h-32 lg:h-80"} 
         hover:shadow-lg  transition-all duration-300 overflow-hidden transform hover:scale-105`}
    >
      
      {isReward ? (
        <div className="w-2/3 sm:w-full sm:h-3/4 flex items-center justify-center p-2">
          {product?.imgURL || item?.image ? (
            <img
              src={product?.imgURL || item?.image}
              alt={product?.name || item?.name || "Reward"}
              className="w-full h-full rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center shadow-inner">
              <Gift className="text-gray-400 text-6xl" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-1/2 lg:w-full lg:h-3/5 flex items-center justify-center p-2">
          <img
            src={product.imgURL}
            alt={product.name}
            className="w-full h-full rounded-xl object-cover shadow-sm"
          />
        </div>
      )}
      {isReward ? (
        <div className="flex sm:flex-col justify-between w-1/2 sm:w-full sm:relative">
          <h3 className="flex flex-col mx-3 justify-center text-sm font-semibold text-secondary">
            <span
              className={` font-bold flex-1 ${
                isReward && canRedeem(item.pointsRequired)
                  ? "text-on-surface"
                  : "text-muted"
              }`}
            >
              {product?.name || item?.name || "Reward"}
            </span>
            {item.pointsRequired}
          </h3>
          <button
            disabled={disabled}
            className={`sm:block px-4 sm:py-2 sm:absolute sm:right-0 sm:bottom-0 rounded-tl-xl transition duration-200 ${
              hovered && "bg-secondary/100"
            }  ${
              canRedeem(item.pointsRequired)
                ? "bg-secondary/80 text-white "
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="text-2xl inline-block transform transition-transform duration-500 group-hover:rotate-270">
              +
            </span>
          </button>
        </div>
      ) : (
        <div className="flex lg:flex-col  justify-between w-1/2 lg:w-full ">
          <h3 className="flex flex-col mx-2 justify-center text-md font-semibold text-primary">
            <div
              className={`text-xs md:text-sm font-semibold lg:font-bold flex-1 lg:line-clamp-1 mt-1`}
            >
              {/* {product?.name || "Product"} */}
              {lang==='ar'?(product.name_ar||product.name):product.name}
            </div>
            <span className="text-xs hidden sm:block text-[#888] leading-snug break-words line-clamp-2 sm:line-clamp-2">
              {/* {product.desc} */}
              {lang==='ar'?(product.desc_ar||product.desc):product.desc}
            </span>
            <div className="mt-5">{product.basePrice} {t('currency')}</div>
          </h3>
          <button
            disabled={disabled}
            className={` hidden px-4 lg:block lg:py-2 lg:absolute lg:right-0  lg:bottom-0 rounded-tl-xl transition duration-200  ${
              hovered ? "bg-primary/100" : ""
            }   ${
              !isReward
                ? "bg-primary/80 text-white"
                : canRedeem(item.pointsRequired)
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="text-2xl inline-block transform transition-transform   duration-500 group-hover:rotate-270">
              +
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
