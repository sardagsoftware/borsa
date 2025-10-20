package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/lydian/go-sdk"
)

func main() {
	client := lydian.NewClient(lydian.Config{
		APIKey: os.Getenv("LYDIAN_API_KEY"),
	})

	ctx := context.Background()

	// Create city
	city, err := client.SmartCities.CreateCity(ctx, lydian.City{
		Name:       "Tokyo",
		Country:    "Japan",
		Population: intPtr(13960000),
		Timezone:   "Asia/Tokyo",
		Metadata: map[string]interface{}{
			"mayor":    "Yuriko Koike",
			"area_km2": 2194,
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("City created: %s\n", city.ID)

	// Create sensor asset
	sensor, err := client.SmartCities.CreateAsset(ctx, lydian.CityAsset{
		CityID: city.ID,
		Type:   "sensor",
		Name:   "Air Quality Sensor #1",
		Location: lydian.Location{
			Latitude:  35.6762,
			Longitude: 139.6503,
			Address:   "Shibuya, Tokyo",
		},
		Status: "active",
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Sensor created: %s\n", sensor.ID)

	// Create alert
	alert, err := client.SmartCities.CreateAlert(ctx, lydian.Alert{
		CityID:      city.ID,
		Type:        "environment",
		Severity:    "high",
		Title:       "High Air Pollution Detected",
		Description: "PM2.5 levels exceeded safe threshold",
		Status:      "open",
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Alert created: %s\n", alert.ID)
}

func intPtr(i int) *int {
	return &i
}
