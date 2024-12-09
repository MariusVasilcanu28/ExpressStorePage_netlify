const deleteProduct = () => {
  const deleteButtons = document.querySelectorAll(".btn-delete");

  deleteButtons.forEach((deleteButton) => {
    deleteButton.addEventListener("click", function () {
      const prodId = this.parentNode.querySelector("[name=productId]").value;
      const csrf = this.parentNode.querySelector("[name=csrfToken]").value;

      const parentElement = this.closest("article");

      fetch(`/admin/product/${prodId}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrf,
        },
      })
        .then((result) => {
          return result.json();
        })
        .then((data) => {
          console.log(data);
          parentElement.parentNode.removeChild(parentElement);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
};

deleteProduct();
