import React, { useState } from 'react';
import classNames from 'classnames';
import { SectionProps } from '../../utils/SectionProps';
import ButtonGroup from '../elements/ButtonGroup';
import Button from '../elements/Button';
import Image from '../elements/Image';
import Modal from '../elements/Modal';

const propTypes = {
  ...SectionProps.types
}

const defaultProps = {
  ...SectionProps.defaults
}

const Menu = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  ...props
}) => {

  const [videoModalActive, setVideomodalactive] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setVideomodalactive(true);
  }

  const closeModal = (e) => {
    e.preventDefault();
    setVideomodalactive(false);
  }

  const outerClasses = classNames(
    'section center-content',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );

  return (
    <section
      {...props}
      className={outerClasses}
    >
      <div className="container-sm">
        <div className={innerClasses}>
          <div className="menu-content">
            <h3 className="mt-0 mb-16 reveal-from-bottom" data-reveal-delay="200">
              Maki
            </h3>
            <div className="menu-figure reveal-from-bottom illustration-element-01" data-reveal-value="20px" data-reveal-delay="800">
              {props.menu.items.maki}
            </div>
          </div>
          <div className="menu-content">
            <h3 className="mt-0 mb-16 reveal-from-bottom" data-reveal-delay="200">
              Nigiri
            </h3>
            <div className="menu-figure reveal-from-bottom illustration-element-01" data-reveal-value="20px" data-reveal-delay="800">
              {props.menu.items.Nigiri}
            </div>
          </div>
      </div>
    </section>
  );
}

Menu.propTypes = propTypes;
Menu.defaultProps = defaultProps;

export default Menu;
