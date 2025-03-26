import React from 'react';
import './CategorySelection.css';

const CategorySelection = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-selection">
      <h2>Select a Category</h2>
      <div className="categories-grid">
        {Object.entries(categories).map(([category, words]) => (
          <button
            key={category}
            className={`category-card ${selectedCategory === category ? 'selected' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <p>{words.length} words</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelection; 