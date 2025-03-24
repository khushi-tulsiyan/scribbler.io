import React from 'react';
import './CategorySelection.css';

const CategorySelection = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-selection">
      <h3>Select Word Category</h3>
      <div className="categories-container">
        {categories.map((category) => (
          <button
            key={category.id}
            className={selectedCategory === category.id ? 'selected' : ''}
            onClick={() => onSelectCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection; 