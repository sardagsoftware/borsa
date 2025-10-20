package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/lydian/go-sdk"
)

func main() {
	// Initialize client with API key
	client := lydian.NewClient(lydian.Config{
		APIKey: os.Getenv("LYDIAN_API_KEY"),
	})

	ctx := context.Background()

	// Create a new city
	city, err := client.SmartCities.CreateCity(ctx, lydian.City{
		Name:       "San Francisco",
		Country:    "USA",
		Population: intPtr(873965),
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("City created: %s\n", city.ID)
}

func intPtr(i int) *int {
	return &i
}
