package vn.demo.jobhunter.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.demo.jobhunter.domain.Review;
import vn.demo.jobhunter.service.ReviewService;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/reviews")
    @ApiMessage("Create a review")
    public ResponseEntity<Review> create(@Valid @RequestBody Review review) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.reviewService.handleCreateReview(review));
    }
}
