import { authGuard } from "../../../utilities/authGuard";

import controllers from "../../../controllers/index";
import utils from "../../../utilities/utils";

import Swiper from "swiper";
import { Navigation, Controller } from "swiper/modules";
import "swiper/css/bundle";

async function init() {
  const loadingIndicator = document.getElementById("loading-indicator");
  loadingIndicator.classList.remove("hidden");

  utils.humberger();
  const container = document.querySelector(".container");
  clearContent(container);
  try {
    await authGuard();

    const id = utils.getUrlParams("id");
    const listings = await fetchListings(id);

    renderListingsElement(listings, id, container);

    attachBidEvent(id);
  } catch (error) {
    console.error("Error fetching Listings:", error);
    container.innerHTML =
      "<p>Error loading Listings. Please try again later.</p>";
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// fetch media
async function fetchListings(id) {
  const { data } = await controllers.ListingsController.listing(id);
  return data;
}

// actions item
function renderListingsElement(listings, id, target) {
  renderListings(listings, target);
  attachEditEvent(id);
  attachDeleteEvent(id);

  // Initialize Swipers only after the elements are rendered
  const slider = new Swiper(".gallery-slider", {
    slidesPerView: 1,
    centeredSlides: true,
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    modules: [Navigation, Controller],
  });

  const thumbs = new Swiper(".gallery-thumbs", {
    slidesPerView: "auto",
    spaceBetween: 10,
    centeredSlides: true,
    loop: true,
    slideToClickedSlide: true,
    modules: [Navigation, Controller],
  });

  // Link the two Swipers after initialization
  slider.controller.control = slider;
  thumbs.controller.control = thumbs;
}

function clearContent(target) {
  target.innerHTML = "";
}

function swiperElem(listings) {
  const listingElement = document.createElement("article");
  listingElement.className = "flex md:flex-1 swiper-container gallery-slider";

  const mediaSlides =
    listings.media
      ?.map(
        (mediaItem) => `
      <div class="swiper-slide bg-white items-center">
        <img class="w-full"
          src="${mediaItem.url || ""}"
          alt="${mediaItem.alt || "Media item"}" />
      </div>
  `
      )
      .join("") || "";

  listingElement.innerHTML = `
    <div class="swiper-wrapper z-10">
      ${mediaSlides}
    </div>
    
    <!-- If we need navigation buttons -->
    <div class="swiper-button-prev z-20"></div>
    <div class="swiper-button-next z-20"></div>
    
  `;
  return listingElement;
}

function swiperGallery(listings) {
  const listingElement = document.createElement("article");
  listingElement.className = "flex md:flex-1 swiper-container gallery-thumbs";

  const mediaSlides =
    listings.media
      ?.map(
        (mediaItem) => `
      <div class="swiper-slide bg-white items-center">
        <img class="w-full"
          src="${mediaItem.url || ""}"
          alt="${mediaItem.alt || "Media item"}" />
      </div>
  `
      )
      .join("") || "";

  listingElement.innerHTML = `
    <div class="swiper-wrapper z-10">
      ${mediaSlides}
    </div>
  `;
  return listingElement;
}

function renderListingInfoElem(listings) {
  const listingInfoElem = document.createElement("div");
  listingInfoElem.className = "p-4 max-w-full mx-auto break-all";
  const listingCreated = utils.date(listings.created);
  const tags = utils.formatTags(listings.tags);

  listingInfoElem.innerHTML = `
    <div class="flex rounded-lg h-full bg-white p-8 flex-col">
      <h2 class="leading-relaxed text-2xl font-bold text-black uppercase">
        ${listings.title}
      </h2>
      <div class="flex flex-col">
        <div class="flex gap-4 relative ">
          <a class="absolute top-1 left-1" href="/profile/?seller=${listings.seller.name}">
            <img class="rounded-full h-8 w-8" src="${
              listings.seller.avatar.url
            }" alt="${listings.seller.avatar.alt} width="32" height="32" />
          </a>
          <a href="/profile/?seller=${listings.seller.name}">
            <h2 class="pl-10 leading-relaxed text-2xl font-bold text-black">${listings.seller.name}</h2>
          </a>
        </div>
        
        <div>
          <h2 class="dark:text-red-700 text-lg font-bold">Listed on: <span class="text-black">${listingCreated}</span>
          </h2>
        </div>
        <div class="leading-relaxed text-base text-black ">
          ${tags}
        </div>  
        <div id="article-body" class="text-lg font-bold dark:text-red-700">
          About this item: <span class="text-black">${listings.description}</span>
        </div>
        <form class="bid-form my-4" data-listing-id="LISTING_ID" id="bid" name="bid">
          <label for="bidAmount" class="leading-relaxed text-lg font-bold dark:text-red-700">Place Your Bid:</label>
          <div class="relative">
            <input
              type="number"
              id="bidAmount"
              name="bidAmount"
              placeholder="Enter your bid amount"
              class="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-base border border-slate-200 rounded-md pl-3 pr-16 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              min="1"
              required
            />
            <button

              type="submit"
              class="absolute right-1 top-1 rounded bg-slate-800 py-1 px-2.5 border border-transparent text-center text-base text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              Bid
            </button>
          </div>
        </form>

        <div class="flex gap-4">${
          isSeller(listings.seller.name)
            ? `<button class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" id="editListing">Update</button>
          <button class="w-full text-white btn-danger-cancel bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" id="deleteListing">Delete</button>`
            : ""
        }
        </div>
        </ฝdivv>
      </div>
    </div>
  `;

  return listingInfoElem;
}



async function renderListings(listings, target) {
  const container = document.createElement("div");
  container.className = "gallery flex w-full sm:flex-col md:flex-row";

  // Create the left column with Swiper
  const swiperContainer = document.createElement("div");
  swiperContainer.className = "w-full md:w-1/2";

  const swiperElement = swiperElem(listings); // Get the Swiper DOM element
  swiperContainer.appendChild(swiperElement); // Append the Swiper element

  const galleryElement = swiperGallery(listings);
  swiperContainer.appendChild(galleryElement);

  // Create the right column with listing info
  const listingInfo = document.createElement("div");
  listingInfo.className = "w-full md:w-1/2";
  const listingInfoElem = renderListingInfoElem(listings);
  listingInfo.appendChild(listingInfoElem);
  // listingInfo.textContent = "Listing Info"; // Replace with dynamic content as needed

  // Append both columns to the second listing element
  container.appendChild(swiperContainer);
  container.appendChild(listingInfo);

  // Append the second listing element to the target
  target.appendChild(container);
}

function isSeller(seller) {
  const authUser = controllers.AuthController.authUser;
  if (authUser.name === seller) return true;
  return false;
}

function attachBidEvent(id) {
  const form = document.forms.bid;

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      controllers.ListingsController.onBid(event, id);
    });
  }
}

function attachEditEvent(id) {
  const editButton = document.getElementById("editListing");
  if (editButton) {
    editButton.addEventListener("click", () => {
      utils.redirectTo(`/listing/edit/?id=${id}`);
    });
  }
}

function attachDeleteEvent(id) {
  const deleteButton = document.getElementById("deleteListing");
  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this listing?"
      );
      if (confirmed) {
        controllers.ListingsController.onDeleteListing(id);
      } else {
        console.log("Delete action canceled");
      }
    });
  }
}

function adjustContentHeight() {
  const footer = document.querySelector("footer");
  const header = document.querySelector("nav");
  const main = document.querySelector(".container");

  const viewportHeight = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const footerHeight = footer.offsetHeight;

  // Set the main content height to fill the remaining space
  main.style.minHeight = `${viewportHeight - headerHeight - footerHeight}px`;
}

// Adjust height on page load and resize
window.addEventListener("load", adjustContentHeight);
window.addEventListener("resize", adjustContentHeight);

init();
