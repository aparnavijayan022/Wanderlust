const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
  let { search } = req.query;

  let allListings;

  if (search) {
    allListings = await Listing.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } }
      ]
    });
  } else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  console.log(listing);

  res.render("listings/show.ejs", { listing });
};


module.exports.createListing = async (req, res, next) => {
  console.log("Location:", req.body.listing.location);

  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;

  newListing.geometry = response.body.features[0].geometry;


  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else {
    newListing.image = {
      filename: "listingimage",
      url: "https://plus.unsplash.com/premium_photo-1748914906710-bd835e486c28?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaGdlfHx8fGVufDB8fHx8fA%3D%3D"
    };
  }


  let savedListing = await newListing.save();

  console.log(savedListing);

  req.flash("success", "New Listing Created!");

  res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;

  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_3w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  Object.assign(listing, req.body.listing);

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");

  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;

  let deletedListing = await Listing.findByIdAndDelete(id);

  console.log(deletedListing);

  req.flash("success", "Listing Deleted!");

  res.redirect("/listings");
};