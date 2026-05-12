package vn.demo.jobhunter.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.demo.jobhunter.domain.Review;
import vn.demo.jobhunter.service.ReviewService;
import vn.demo.jobhunter.util.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @controller ReviewController
 * @description API Đánh giá Công ty - Người dùng đánh giá công ty
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Review", description = "API Đánh giá Công ty")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/reviews")
    @ApiMessage("Create a review")
    @Operation(summary = "Tạo đánh giá", description = "Đánh giá công ty (rating + bình luận)")
    public ResponseEntity<Review> create(@Valid @RequestBody Review review) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.reviewService.handleCreateReview(review));
    }
}
