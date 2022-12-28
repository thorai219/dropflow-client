import { FC } from 'react';
import { Element } from 'react-scroll';
import ProductGridHome from '@/components/products/grids/home';

export const SearchLayout: FC = (props) => {
  return (
    <>
      <Element
        name="grid"
        className="flex border-t border-solid border-border-200 border-opacity-70"
      >
        <ProductGridHome
          className="px-4 pb-8 lg:p-8"
          variables={props.variables.products}
        />
      </Element>
    </>
  );
};

export default SearchLayout;
