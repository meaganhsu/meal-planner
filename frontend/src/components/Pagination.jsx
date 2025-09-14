import "../styles/Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];

    // maximum visible page buttons = 5

    let startPage = Math.max(1, currentPage - Math.floor(3 / 2));  // first page num in page window
    let endPage = Math.min(totalPages, startPage + 3 - 1);     // last page num in page window

    // when page window is close to first or last page
    if (endPage - startPage + 1 < 3) {
        startPage = Math.max(1, endPage - 3 + 1);
    }

    // generating page numbers array
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination-container">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
            >
                ←
            </button>

            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="pagination-button">
                        1
                    </button>
                    {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                </>
            )}

            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                >
                    {number}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                    <button onClick={() => onPageChange(totalPages)} className="pagination-button">
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
            >
                →
            </button>
        </div>
    );
};

export default Pagination;