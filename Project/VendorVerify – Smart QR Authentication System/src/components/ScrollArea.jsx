import React from 'react';

export const ScrollArea = ({ children, className = '', style = {}, maxHeight = '400px' }) => {
    return (
        <div
            className={`scroll-area ${className}`}
            style={{
                maxHeight: maxHeight,
                overflowY: 'auto',
                overflowX: 'hidden',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default ScrollArea;
